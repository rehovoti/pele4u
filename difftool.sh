if [ $# -eq 0 ]
  then
    echo "USAGE : ./difftool.sh branch1 <branch2>"
fi

git difftool --no-prompt --dir-diff $1 $2
